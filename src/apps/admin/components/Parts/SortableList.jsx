// SortableList.jsx
import React from "react";
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    arrayMove,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import "./SortableList.scss";

/**
 * items: [{ id: string|number, ... }]
 * getId: (item) => string|number  // optional
 * renderItem: (item) => ReactNode
 * onReorder: async ({ activeId, overId, oldIndex, newIndex, nextItems }) => void
 */
export function SortableList({
    items,
    getId = (item) => item.id,
    renderItem,
    onReorder,
    activationDistance = 6,
    className,
    style,
}) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: activationDistance },
        })
    );

    const ids = React.useMemo(() => items.map((it) => String(getId(it))), [items, getId]);

    const handleDragEnd = async ({ active, over }) => {
        console.log("active:", active?.id, "over:", over?.id);
        if (!over || active.id === over.id) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        const oldIndex = ids.indexOf(activeId);
        const newIndex = ids.indexOf(overId);
        if (oldIndex < 0 || newIndex < 0) return;

        const nextItems = arrayMove(items, oldIndex, newIndex);

        await onReorder?.({
            activeId,
            overId,
            oldIndex,
            newIndex,
            nextItems,
        });
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <div className={className} style={style}>
                    {items.map((item) => (
                        <SortableRow key={String(getId(item))} id={String(getId(item))}>
                            {renderItem(item)}
                        </SortableRow>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

function SortableRow({ id, children }) {
    const {
        setNodeRef,
        setActivatorNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            className="sortable-row"
            data-dragging={isDragging ? "true" : "false"}
            style={{
                "--sortable-transform": CSS.Transform.toString(transform),
                "--sortable-transition": transition ?? "none",
            }}
        >
            {children}
            <button
                type="button"
                ref={setActivatorNodeRef}
                {...listeners}
                onClick={(e) => e.preventDefault()}
                className="sortable-row__handle"
                aria-label="drag"
            >
                ≡
            </button>
        </div>
    );
}
