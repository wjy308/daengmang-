/** 로스트아크 경매장 등록 수수료 5% 반영 */
export const LOA_AUCTION_NET_RATE = 0.95;

export type RaidPartySize = 4 | 8;

export interface RiceBidRow {
  id: string;
  label: string;
  bid: number;
  profit: number;
}

function partyShare(partySize: RaidPartySize): number {
  return (partySize - 1) / partySize;
}

/**
 * 로아 레이드 경매 입찰 상한 (유각시세 등 공식)
 * - 손익분기: 시세 × 0.95 × (n-1)/n
 * - 직접 사용: 시세 × (n-1)/n
 * - 선점: 손익분기 ÷ (1 + 0.1 × 비율), 이득 = 손익분기 − 입찰가
 */
export function calcRiceBidRows(
  marketPrice: number,
  partySize: RaidPartySize,
): RiceBidRow[] {
  if (!Number.isFinite(marketPrice) || marketPrice <= 0) {
    return [];
  }

  const share = partyShare(partySize);
  const sellBreakEven = Math.floor(marketPrice * LOA_AUCTION_NET_RATE * share);
  const directUse = Math.floor(marketPrice * share);

  const snipeRow = (
    divisor: number,
    label: string,
    id: string,
  ): RiceBidRow => {
    const bid = Math.floor(sellBreakEven / divisor);
    return { id, label, bid, profit: sellBreakEven - bid };
  };

  return [
    {
      id: "direct",
      label: "직접 사용",
      bid: directUse,
      profit: 0,
    },
    {
      id: "break-even",
      label: "손익분기점",
      bid: sellBreakEven,
      profit: 0,
    },
    snipeRow(1.025, "선점 25%", "snipe-25"),
    snipeRow(1.05, "선점 50%", "snipe-50"),
    snipeRow(1.075, "선점 75%", "snipe-75"),
    snipeRow(1.1, "선점", "snipe"),
  ];
}

export function formatGold(value: number): string {
  return value.toLocaleString("ko-KR");
}
