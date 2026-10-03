"use client";

import { createContext, useContext, ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { Spinner } from "@/components/ui/spinner";

const LiveblocksStatusContext = createContext<boolean>(false);

export function useIsLiveblocksEnabled() {
  return useContext(LiveblocksStatusContext);
}

export function Room({
  roomId,
  hasLiveblocks = false,
  children,
}: {
  roomId: string;
  hasLiveblocks?: boolean;
  children: ReactNode;
}) {
  if (!hasLiveblocks) {
    return (
      <LiveblocksStatusContext.Provider value={false}>
        {children}
      </LiveblocksStatusContext.Provider>
    );
  }

  return (
    <LiveblocksStatusContext.Provider value={true}>
      <LiveblocksProvider
        throttle={16}
        authEndpoint="/api/liveblocks/auth"
        resolveUsers={async ({ userIds }) => {
          try {
            const response = await fetch("/api/liveblocks/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userIds }),
            });

            if (!response.ok) {
              return undefined;
            }

            return await response.json();
          } catch {
            return undefined;
          }
        }}
      >
        <RoomProvider id={roomId}>
          <ClientSideSuspense
            fallback={
              <div className="flex min-h-svh items-center justify-center">
                <Spinner className="size-6 text-muted-foreground" />
              </div>
            }
          >
            {children}
          </ClientSideSuspense>
        </RoomProvider>
      </LiveblocksProvider>
    </LiveblocksStatusContext.Provider>
  );
}