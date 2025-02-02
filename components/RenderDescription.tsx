// Create a new component to render the description
function RenderDescription({ content }: { content: any[] }) {
	const renderContent = (items: any[]) => {
		return items.map((item, index) => {
			switch (item.type) {
				case "paragraph":
					return (
						<p key={index} className="mb-2">
							{item.content && renderContent(item.content)}
						</p>
					);
				case "text":
					if (item.marks && item.marks.find((mark: any) => mark.type === "strong")) {
						return <strong key={index}>{item.text}</strong>;
					}
					if (item.marks && item.marks.find((mark: any) => mark.type === "link")) {
						return (
							<a
								key={index}
								href={item.marks.find((mark: any) => mark.type === "link").attrs.href}
								className="text-blue-500 hover:underline"
								target="_blank"
								rel="noopener noreferrer">
								{item.text}
							</a>
						);
					}
					return <span key={index}>{item.text}</span>;
				case "bulletList":
					return (
						<ul key={index} className="list-disc ml-6 mb-2">
							{item.content && renderContent(item.content)}
						</ul>
					);
				case "listItem":
					return <li key={index}>{item.content && renderContent(item.content)}</li>;
				case "hardBreak":
					return <br key={index} />;
				default:
					return null;
			}
		});
	};

	return <div className="prose dark:prose-invert max-w-none">{renderContent(content)}</div>;
}
export default RenderDescription;
