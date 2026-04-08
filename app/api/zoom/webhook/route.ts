import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event;
    const obj = body.payload?.object || {};
    const participant = obj.participant || {};

    console.log(`📍 Event: ${event} | ${participant.user_name} (${participant.email})`);

    if (event === 'meeting.participant_joined') {
      console.log(`✅ SHOWED: ${participant.user_name}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
