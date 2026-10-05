'use server';

import { redirect } from 'next/navigation';

import { clearSessionCookie } from '@/utils/firebase/session';

export async function signOut() {
  await clearSessionCookie();
  redirect('/login');
}