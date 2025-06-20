import {Investor} from "@/store/investorsStore";

export function areContributorListsEqualById(
    prev: Investor[],
    next: Investor[],
): boolean {
    // ① 두 리스트의 길이가 다르면 바로 false
    if (prev.length !== next.length) return false;

    // ② id 집합(Set) 생성
    const prevIds = new Set(prev.map(i => i.id));
    const nextIds = new Set(next.map(i => i.id));

    // ③ 크기가 다르면 false
    if (prevIds.size !== nextIds.size) return false;

    // ④ 모든 id 가 서로 존재하는지 확인
    for (const id of prevIds) {
        if (!nextIds.has(id)) return false;
    }
    return true;          // 완벽히 동일
}