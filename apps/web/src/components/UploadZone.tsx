import { useDropzone } from 'react-dropzone';

type DropzoneProps = {
  onDrop: (acceptedFiles: File[]) => void;
}

export function MyDropzone({ onDrop }: Readonly<DropzoneProps>) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {
        isDragActive ?
          <p>Drop the files here ...</p> :
          <p>Drag 'n' drop some files here, or click to select files</p>
      }
    </div>
  )
}