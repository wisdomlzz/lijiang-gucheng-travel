import { ReactNode } from "react";
import { PageHeader } from "./PageHeader";

export function PageLayout({
  title, description, actions, children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="p-6 space-y-4">
      <PageHeader title={title} desc={description} actions={actions} />
      {children}
    </div>
  );
}
