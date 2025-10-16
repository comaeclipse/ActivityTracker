"use client";
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function TopStatusBar() {
  const [status, setStatus] = useState("");

  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <div className="p-4 space-y-2">
        <Input
          placeholder="What are you up to?"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary">+8oz Water</Button>
          <Button variant="secondary">Log Run</Button>
          <Button variant="secondary">Log Bike</Button>
          <Button variant="secondary">Log Swim</Button>
          <div className="ms-auto" />
          <Button>Share</Button>
        </div>
      </div>
    </div>
  );
}
