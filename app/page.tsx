import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import { IEvent } from "@/database";
import { cacheLife } from "next/cache";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const Page = async () => {
    "use cache";
    cacheLife("hours");

    let events: IEvent[] = [];

    try {
        const response = await fetch(`${BASE_URL}/api/events`);

        // Check if response is ok before parsing JSON
        if (!response.ok) {
            console.error(`Failed to fetch events: ${response.status} ${response.statusText}`);
            // Continue with empty events array
        } else {
            const data = await response.json();

            // Validate response shape and safely assign events
            if (data && Array.isArray(data.events)) {
                events = data.events;
            } else {
                console.error("Invalid response shape: events is not an array");
            }
        }
    } catch (error) {
        // Handle network errors or JSON parsing failures
        console.error("Error fetching events:", error);
        // Continue with empty events array for graceful degradation
    }

    return (
        <section>
            <h1 className="text-center">The Hub for Every Dev <br /> Event You Can't Miss</h1>
            <p className="text-center mt-5">Hackathons, Meetups and Conferences, All in One Place</p>

            <ExploreBtn />

            <div className="mt-20 space-y-7">
                <h3>Featured Events</h3>

                <ul className="events">
                    {events && events.length > 0 && events.map((event: IEvent) => (
                        <li key={event.title} className="list-none">
                            <EventCard {...event} />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
};

export default Page;
