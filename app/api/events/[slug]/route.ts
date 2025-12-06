import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Event, { IEvent } from "@/database/event.model";

// Type for route params in Next.js App Router
interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * GET /api/events/[slug]
 * Fetches a single events by its slug
 */
export async function GET(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    // Await params to get the slug value
    const { slug } = await context.params;

    // Validate slug parameter
    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { 
          message: "Slug parameter is required and must be a valid string",
          error: "INVALID_SLUG"
        },
        { status: 400 }
      );
    }

    // Validate slug format (alphanumeric and hyphens only)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        {
          message: "Invalid slug format. Slug must contain only lowercase letters, numbers, and hyphens",
          error: "INVALID_SLUG_FORMAT"
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Query events by slug
    const event: IEvent | null = await Event.findOne({ slug }).lean();

    // Handle events not found
    if (!event) {
      return NextResponse.json(
        {
          message: `Event with slug "${slug}" not found`,
          error: "EVENT_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    // Return successful response
    return NextResponse.json(
      {
        message: "Event fetched successfully",
        event
      },
      { status: 200 }
    );
  } catch (error) {
    // Log error for debugging (server-side only)
    console.error("Error fetching events by slug:", error);

    // Handle different error types
    if (error instanceof Error) {
      // Database connection or query errors
      return NextResponse.json(
        {
          message: "Failed to fetch events",
          error: "DATABASE_ERROR",
          details: process.env.NODE_ENV === "development" ? error.message : undefined
        },
        { status: 500 }
      );
    }

    // Unknown error type
    return NextResponse.json(
      {
        message: "An unexpected error occurred",
        error: "INTERNAL_SERVER_ERROR"
      },
      { status: 500 }
    );
  }
}
