import axios from "axios";

export interface CalBookingDetails {
  bookingId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  attendeeName: string;
  attendeeEmail: string;
  status: "BOOKED" | "CANCELLED" | "RESCHEDULED";
}

/**
 * Fetch and verify booking payload details from Cal.com API.
 */
export async function verifyCalBooking(
  bookingUid: string,
  apiKey?: string
): Promise<CalBookingDetails> {
  if (!apiKey || apiKey === "") {
    console.warn("⚠️ CAL_API_KEY is missing. Returning simulated booking verification details.");
    
    return {
      bookingId: bookingUid,
      title: "ApexSDR Demo & Onboarding",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000 * 2), // 2 days from now
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 * 2 + 1800000), // 30 mins
      attendeeName: "Rohan Mehta",
      attendeeEmail: "rohan.mehta@groww.in",
      status: "BOOKED",
    };
  }

  try {
    const response = await axios.get(`https://api.cal.com/v1/bookings/${bookingUid}?apiKey=${apiKey}`);
    const data = response.data?.booking;

    return {
      bookingId: bookingUid,
      title: data?.title || "Sales Call",
      startTime: new Date(data?.startTime),
      endTime: new Date(data?.endTime),
      attendeeName: data?.attendees?.[0]?.name || "Lead Name",
      attendeeEmail: data?.attendees?.[0]?.email || "",
      status: data?.status === "CANCELLED" ? "CANCELLED" : "BOOKED",
    };
  } catch (error: any) {
    console.error("❌ Cal.com API fetch failed:", error.message);
    throw error;
  }
}
