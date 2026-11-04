import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type RoomDetail, type RoomGroupDetail, setRoomGroup } from "../../data/api";
import * as hooks from "../../data/hooks";
import RoomGroupSection from "./RoomGroupSection";

vi.mock("../../data/api", () => ({
  setRoomGroup: vi.fn(async () => {}),
}));

vi.mock("../../data/hooks", () => ({
  useRoomGroups: vi.fn(),
}));

const group: RoomGroupDetail = {
  id: "g1",
  name: "Customers",
  description: null,
  color: null,
  parent_group_id: null,
  room_count: 1,
  created_at: "2026-01-01",
};

function renderSection(opts: {
  groupId: string | null;
  canFile: boolean;
  canWrite: boolean;
  groups: RoomGroupDetail[];
}) {
  vi.mocked(hooks.useRoomGroups).mockReturnValue({
    data: opts.groups,
    loading: false,
    error: null,
    refetch: vi.fn(),
  });
  const room = { id: "r1", group_id: opts.groupId } as RoomDetail;
  render(
    <RoomGroupSection
      room={room}
      canWrite={opts.canWrite}
      canFile={opts.canFile}
      onChanged={vi.fn()}
    />,
  );
}

describe("RoomGroupSection", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(setRoomGroup).mockClear();
  });

  it("gives an admin the group picker", () => {
    renderSection({ groupId: null, canFile: true, canWrite: true, groups: [group] });
    expect(screen.getByLabelText("Group")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /remove from group/i })).toBeNull();
  });

  it("shows anyone else the current group and lets a writer take the room out", async () => {
    renderSection({ groupId: "g1", canFile: false, canWrite: true, groups: [group] });
    expect(screen.queryByLabelText("Group")).toBeNull();
    expect(screen.getByText("Customers")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /remove from group/i }));
    await waitFor(() => expect(setRoomGroup).toHaveBeenCalledWith("r1", null));
  });

  it("names a group missing from the loaded list", () => {
    renderSection({ groupId: "hidden", canFile: false, canWrite: true, groups: [] });
    expect(screen.getByText("A group not in your list")).toBeTruthy();
    expect(screen.getByRole("button", { name: /remove from group/i })).toBeTruthy();
  });

  it("offers no removal without write access", () => {
    renderSection({ groupId: "g1", canFile: false, canWrite: false, groups: [group] });
    expect(screen.getByText("Customers")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /remove from group/i })).toBeNull();
  });
});
