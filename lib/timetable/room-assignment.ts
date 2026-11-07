export type RoomCandidate = {
  id: string;
};

/**
 * Rooms must arrive already ordered by room number and then id. The first room
 * whose id is not occupied in the requested interval is the deterministic
 * automatic assignment.
 */
export function selectFirstFreeRoom<T extends RoomCandidate>(
  rooms: readonly T[],
  occupiedRoomIds: ReadonlySet<string>,
): T | null {
  return rooms.find((room) => !occupiedRoomIds.has(room.id)) ?? null;
}
