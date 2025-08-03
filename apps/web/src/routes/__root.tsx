import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import * as React from "react";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<React.Fragment>
			<div>
				<Link to="/" className="nav-link">
					Home
				</Link>
				<Link to="/files" className="nav-link">
					Files
				</Link>
				<Link to="/upload" className="nav-link">
					Upload
				</Link>
			</div>
			<Outlet />
		</React.Fragment>
	);
}
