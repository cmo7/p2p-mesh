import { createFileRoute } from "@tanstack/react-router"
import { useFileStore } from "../../store/fileStore"
import { getHydratedFile } from "../../lib/storage"
import type { Chunk, ChunkedFile } from "core"
import React from "react"

export const Route = createFileRoute("/details/$id")({
  component: RouteComponent,
})

function RouteComponent() {
const { id } = Route.useParams()
const decodedId = decodeURIComponent(id || "")
const file = useFileStore().getFileByHash(decodedId)
const [hypdratedFile, setHydratedFile] = React.useState<ChunkedFile | null>(null)
React.useEffect(() => {
  const f = async () => {
    if (file) {
      const hFile = await getHydratedFile(file.file.hash, {
        onDbRetrievalProgress: (p: number, t: number) => {
          useFileStore.getState().updateProgress(file.file.hash, (p / t) * 100)
        },
      })
      if (!hFile) {
        console.error("File not found in IndexedDB:", file.file.hash)
        return
      }
      setHydratedFile(hFile)
    }
  }
  f()
}, [file]);
  return (
    <div>
      <h1>File Details</h1>
      {file ? (
        <div>
          <p><strong>Filename:</strong> {file.file.filename}</p>
          <p><strong>Hash:</strong> {file.file.hash}</p>
          <p><strong>Status:</strong> {file.status}</p>
          <p><strong>Progress:</strong> {file.progress}%</p>
          <ChunkViewer chunks={hypdratedFile?.chunks} />
        </div>
      ) : (
        <p>No file found with hash: {decodedId}</p>
      )}
    </div>
  )
}

function ChunkViewer({ chunks }: { chunks: Chunk[] | undefined }) {
  if (!chunks) {
    return <p>No chunks available.</p>
  }
  if (!chunks || chunks.length === 0) {
    return <p>No chunks available.</p>
  }
  return (
    <div>
      <h2>Chunks</h2>
      <ul>
        {chunks.map((chunk, index) => (
          <li key={index}>
            <strong>Chunk {index + 1}:</strong> {JSON.stringify(chunk)}
          </li>
        ))}
      </ul>
    </div>
  )
}