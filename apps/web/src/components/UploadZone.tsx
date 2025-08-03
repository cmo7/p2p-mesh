import { useDropzone } from "react-dropzone";

type DropzoneProps = {
	onDrop: (acceptedFiles: File[]) => void;
};

export function MyDropzone({ onDrop }: Readonly<DropzoneProps>) {
	const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

	return (
		<div {...getRootProps()}>
			<input {...getInputProps()} />
			{isDragActive ? (
				<p
					style={{
						color: "#2196F3",
						fontWeight: "bold",
					}}
				>
					Drop the files here ...
				</p>
			) : (
				<p
					style={{
						color: "#666",
					}}
				>
					Drag 'n' drop some files here, or click to select files
				</p>
			)}
		</div>
	);
}
