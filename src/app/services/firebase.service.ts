import { Injectable, OnDestroy } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore, Firestore,
  collection, onSnapshot, query, orderBy, limit,
  writeBatch, getDocs, where,
} from 'firebase/firestore';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAL4amWGasNJ5bxAYzL6pCi9X0B_8o4Ieg',
  authDomain: 'ninaivugal-73074.firebaseapp.com',
  projectId: 'ninaivugal-73074',
  storageBucket: 'ninaivugal-73074.firebasestorage.app',
  messagingSenderId: '724054078597',
  appId: '1:724054078597:web:4568382c9e1c9af69265ec',
};

export interface FBNotification {
  id: string;
  type: 'new_follower' | 'shared_memory';
  actor_name: string;
  actor_id: string;
  entry_id?: string;
  read: boolean;
  created_at: { seconds: number; nanoseconds: number } | string | null;
}

@Injectable({ providedIn: 'root' })
export class FirebaseService implements OnDestroy {
  private app: FirebaseApp;
  private db: Firestore;
  private unsub?: () => void;
  private userId = '';

  constructor() {
    this.app = initializeApp(FIREBASE_CONFIG);
    this.db = getFirestore(this.app);
  }

  async connect(userId: string, onUpdate: (notifications: FBNotification[]) => void): Promise<void> {
    if (this.userId === userId) {
      console.log('[Firebase] Already connected for', userId);
      return;
    }
    this.userId = userId;
    console.log('[Firebase] Connecting for user', userId);
    this._listen(userId, onUpdate);
  }

  private _listen(userId: string, onUpdate: (n: FBNotification[]) => void) {
    this.unsub?.();
    const path = `notifications/${userId}/items`;
    console.log('[Firebase] Attaching onSnapshot listener →', path);
    const itemsRef = collection(this.db, 'notifications', userId, 'items');
    const q = query(itemsRef, orderBy('created_at', 'desc'), limit(30));

    this.unsub = onSnapshot(q, snapshot => {
      console.log('[Firebase] Snapshot received —', snapshot.docs.length, 'items');
      const items = snapshot.docs.map(d => d.data() as FBNotification);
      onUpdate(items);
    }, err => {
      console.error('[Firebase] onSnapshot error:', err.code, err.message);
    });
  }

  async markAllRead(userId: string): Promise<void> {
    try {
      const itemsRef = collection(this.db, 'notifications', userId, 'items');
      const unreadQ = query(itemsRef, where('read', '==', false));
      const snap = await getDocs(unreadQ);
      if (snap.empty) return;
      const batch = writeBatch(this.db);
      snap.docs.forEach(d => batch.update(d.ref, { read: true }));
      await batch.commit();
    } catch (e) {
      console.warn('[Firebase] markAllRead failed:', e);
    }
  }

  createdAt(n: FBNotification): string {
    if (!n.created_at) return '';
    if (typeof n.created_at === 'string') return n.created_at;
    return new Date(n.created_at.seconds * 1000).toISOString();
  }

  disconnect() {
    this.unsub?.();
    this.unsub = undefined;
    this.userId = '';
  }

  ngOnDestroy() { this.disconnect(); }
}
