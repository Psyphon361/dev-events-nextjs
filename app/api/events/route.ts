import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Event from "@/database/event.model";

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const formData = await req.formData();

        const event = Object.fromEntries(formData.entries());

        const file = formData.get("image") as File;
        if (!file)
            return NextResponse.json({ message: "Image file is required!" }, { status: 400 });

        // Parse JSON fields with proper error handling
        let tags;
        let agenda;

        try {
            tags = JSON.parse(formData.get("tags") as string);
        } catch (e) {
            return NextResponse.json({ message: "Invalid JSON format for tags field" }, { status: 400 });
        }

        try {
            agenda = JSON.parse(formData.get("agenda") as string);
        } catch (e) {
            return NextResponse.json({ message: "Invalid JSON format for agenda field" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: "image", folder: "DevEvent" }, (error, result) => {
                if (error)
                    return reject(error);

                resolve(result);
            }).end(buffer);
        });

        event.image = (uploadResult as { secure_url: string }).secure_url;

        const createdEvent = await Event.create({
            ...event,
            tags: tags,
            agenda: agenda
        });

        return NextResponse.json({ message: "Event created successfully", event: createdEvent }, { status: 201 });
    } catch (e) {
        console.log(e);
        return NextResponse.json({
            message: "Event Creation failed", error: e instanceof Error ? e.message : "Unknown"
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        await connectToDatabase();

        const events = await Event.find().sort({ createdAt: -1 });

        return NextResponse.json({ message: "Events fetched successfully", events }, { status: 200 });
    } catch (e) {
        // Log the full error with stack trace for server-side debugging
        console.error("Event fetching failed:", e);

        // Return safe, serializable error payload without exposing sensitive info
        const errorMessage = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ 
            message: "Event fetching failed", 
            error: errorMessage 
        }, { status: 500 });
    }
}
