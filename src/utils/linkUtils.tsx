
export const renderTextWithLinks = (text: string) => {
    // Regex to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Split text by URL
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
        if (part.match(urlRegex)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline cursor-pointer relative z-20"
                    onClick={(e) => e.stopPropagation()}
                >
                    Link
                </a>
            );
        }
        return part;
    });
};
