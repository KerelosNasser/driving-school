"use client";

import React, { useState, useMemo } from "react";
import { DragDropProvider } from "../../lib/drag-drop";
import { ComponentPalette } from "./ComponentPalette";
import PageDropZones from "./PageDropZones";
import { useEditMode } from "../../contexts/editModeContext";
import { useDragDrop } from "../../lib/drag-drop/useDragDrop";
import { ComponentDefinition } from "../../lib/types/drag-drop";
import CanvasErrorBoundary from './CanvasErrorBoundary';

interface EditablePageLayoutProps {
	pageName?: string;
}

// Minimal sample components to populate the page when no real data available
const SAMPLE_COMPONENTS = [
	{
		id: 'comp-1',
		type: 'text-paragraph',
		position: { pageId: 'home', sectionId: 'main', order: 0 },
		props: { text: 'Sample paragraph content' }
	}
];

export default function EditablePageLayout({ pageName = 'home' }: EditablePageLayoutProps) {
	const { isEditMode } = useEditMode();
	const { isDragging } = useDragDrop();

	// Build sample sections (main + sidebar) when no CMS data is present.
	const sections = useMemo(() => [
		{
			id: 'main',
			name: 'Main content',
			type: 'main',
			allowedComponents: ['new_component', 'existing_component'],
			maxComponents: 20,
			currentComponents: SAMPLE_COMPONENTS
		},
		{
			id: 'sidebar',
			name: 'Sidebar',
			type: 'sidebar',
			allowedComponents: ['new_component'],
			maxComponents: 5,
			currentComponents: []
		}
	], [] as any);

	if (!isEditMode) {
		// In read mode we don't render the editor UI
		return null;
	}

	return (
		<DragDropProvider>
		  {/* Ensure the canvas area accepts pointer events while editing; some global overlays
			  use pointer-events-none for decorative layers which can accidentally block the editor. */}
		  <div data-edit-mode={isEditMode ? 'true' : 'false'} style={{ pointerEvents: isEditMode ? 'auto' : undefined }} className="p-6 max-w-7xl mx-auto">
			<CanvasErrorBoundary>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Component Palette (left) */}
					<div className="lg:col-span-1">
						<ComponentPalette userId="demo-user" userName="Demo" />
					</div>

					{/* Drop zones (right) */}
					<div className="lg:col-span-2">
									<PageDropZones
										pageName={pageName}
										sections={sections as any}
							onComponentAdd={() => {}}
							onComponentMove={() => {}}
							onComponentDelete={() => {}}
							className="bg-white border rounded-lg p-4"
						/>
					</div>
				</div>

				{/* Small debug/status area */}
				<div className="mt-6 text-sm text-gray-600">
					<div>Drag state: {isDragging ? 'Dragging' : 'Idle'}</div>
					<div>Page: {pageName}</div>
				</div>
		</CanvasErrorBoundary>
	  </div>
	</DragDropProvider>
	);
}
