import { NextResponse } from 'next/server';
import { requireAuth, getDataViewingState } from '../../../../libs/serverAuth';

export const runtime = 'nodejs';

/*
 * Read-only view of the shareholder data-viewing switch for the page chrome.
 *
 * The dividend endpoints already enforce the switch (requireDividendDataAccess),
 * but a shareholder only learns that after opening a page. This lets the header
 * hide the links that lead there, and lets the home dashboard show the notice in
 * place of the services, before anything is clicked.
 *
 * Deliberately tiny on purpose: no counts, no shareholder rows, no admin controls
 * — just the state of the switch and the message that goes with it.
 */

/** GET /api/data-access/status -> { enabled, notice?, note? } */
export async function GET(request) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const { enabled, note, notice } = await getDataViewingState();

    // The notice is the message shareholders are meant to read while access is
    // closed. While it is open the stored text is an unpublished draft, so it is
    // not handed out.
    if (enabled) {
      return NextResponse.json({ enabled: true });
    }

    return NextResponse.json({ enabled: false, note, notice });
  } catch (error) {
    console.error('Data access status read error:', error);
    return NextResponse.json(
      { message: 'We could not read the access status. Please try again.' },
      { status: 500 }
    );
  }
}
