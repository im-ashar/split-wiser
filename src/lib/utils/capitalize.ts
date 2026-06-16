export function capitalizeFullName(name: string): string {
	return name
		.split(' ')
		.filter((part) => part.length > 0)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}
