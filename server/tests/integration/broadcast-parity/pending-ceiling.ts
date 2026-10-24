/**
 * The write tools that may still stand in a group's `pending` list (plan
 * section 3.5), so pending only shrinks. A new write tool gets a case or an
 * exemption, never a pending row: BCP-REG-008 fails on a pending row that is
 * not listed here. A tool that gets its case leaves this list in the same
 * change, so it cannot slip back, and a listed tool no group holds as pending
 * fails as well. The list goes once `pending` leaves the type (plan section
 * 2.10, closing phase B).
 */
export const PENDING_CEILING: readonly string[] = [];
