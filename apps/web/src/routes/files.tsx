import { createFileRoute } from "@tanstack/react-router"
import { Section } from "../components/Section"
import { FilesInDB } from "../components/FilesInDB"

export const Route = createFileRoute("/files")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <Section title="Files">
        <FilesInDB />
      </Section>
    </div>
  )
}
