import { UnlockClient } from "./unlock-client";

type PageProps = {
  params: { token: string };
};

export default function UnlockPage({ params }: PageProps) {
  return <UnlockClient token={params.token} />;
}
