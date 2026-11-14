import { createFileRoute } from "@tanstack/react-router";

import { ProfileManagerPage } from "@/features/profile-manager/profile-manager-page";

export const Route = createFileRoute("/")({
	component: ProfileManagerPage,
});
