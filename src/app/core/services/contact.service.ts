// Placeholder for the not-yet-built contact/lead submission backend.
//
// Port context: the reference's request-modal.tsx posts to `/api/contact`
// (src/app/api/contact/route.ts) via the typed `apiFetch` helper
// (src/lib/api-client.ts), which validates { name, email, message } with zod
// and forwards to an optional upstream CRM/webhook. Angular has no API route
// layer in this repo yet, so this stub matches the request/response shape
// and simply logs + resolves. A later phase should replace `submit`'s body
// with a real HTTP call (e.g. via HttpClient) to whatever backend replaces
// the Next.js route handler.
import { Injectable } from '@angular/core';

export interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

export interface ContactResponse {
  received: true;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  async submit(data: ContactRequest): Promise<ContactResponse> {
    // TODO(later phase): replace with a real HttpClient POST to the backend
    // that succeeds src/app/api/contact/route.ts, and surface its error
    // envelope (`{ error: { code, message, issues? } }`) the way
    // `ApiClientError` does in the reference's api-client.ts.
    console.log('[contact] submission:', data);
    return { received: true };
  }
}
