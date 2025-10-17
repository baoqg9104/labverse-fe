import type { Criteria, RankingItem } from "./RankingTypes";
import PodiumCard from "./PodiumCard";

export default function Podium({
  items,
  criteria,
  onClickUser,
}: {
  items: RankingItem[];
  criteria: Criteria;
  onClickUser?: (u: RankingItem) => void;
}) {
  if (!items || items.length === 0) return null;
  const [first, second, third] = [items[0], items[1], items[2]];
  return (
    <div className="px-4 pt-6 pb-4 border-b bg-white">
      <div className="grid grid-cols-3 gap-4 md:gap-6 items-end">
        {second ? (
          <PodiumCard
            item={second}
            rank={2}
            criteria={criteria}
            className="order-1"
            onClick={() => onClickUser?.(second)}
          />
        ) : (
          <div className="order-1 invisible" />
        )}

        {first ? (
          <PodiumCard
            item={first}
            rank={1}
            criteria={criteria}
            className="order-2 -translate-y-2"
            tall
            onClick={() => onClickUser?.(first)}
          />
        ) : (
          <div className="order-2 invisible" />
        )}

        {third ? (
          <PodiumCard
            item={third}
            rank={3}
            criteria={criteria}
            className="order-3"
            onClick={() => onClickUser?.(third)}
          />
        ) : (
          <div className="order-3 invisible" />
        )}
      </div>
    </div>
  );
}
