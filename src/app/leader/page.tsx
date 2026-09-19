import { redirect } from "next/navigation";

/** 공대장 도구는 레이드 정리 화면의 탭이 됐다. 예전 주소로 와도 그 탭으로 보낸다. */
export default function LeaderPage() {
  redirect("/?tab=leader");
}
