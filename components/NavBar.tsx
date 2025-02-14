"use client";
import { useState } from "react";
import { FiHome, FiUsers, FiFile, FiSettings, FiUser } from "react-icons/fi";

interface NavLink {
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
}

export default function Navbar() {
	const [activePage, setActivePage] = useState<string>("issues");

	const navLinks: NavLink[] = [
		{
			icon: <FiFile size={24} />,
			label: "Issues",
			onClick: () => setActivePage("issues"),
		},
		{
			icon: <FiHome size={24} />,
			label: "Projects",
			onClick: () => setActivePage("projects"),
		},
		{
			icon: <FiUsers size={24} />,
			label: "Teams",
			onClick: () => setActivePage("teams"),
		},
		{
			icon: <FiSettings size={24} />,
			label: "Settings",
			onClick: () => setActivePage("settings"),
		},
	];

	return (
		<nav className="main-nav">
			<div className="logo">
				<h1>Project Manager</h1>
			</div>
			<ul className="nav-links">
				{navLinks.map((link) => (
					<li key={link.label}>
						<button onClick={link.onClick} className={`${activePage === link.label ? "active" : ""}`}>
							<span className="icon">{link.icon}</span>
							<span className="label">{link.label}</span>
						</button>
					</li>
				))}
			</ul>
			<div className="user-avatar">
				<FiUser size={32} />
			</div>
		</nav>
	);
}
