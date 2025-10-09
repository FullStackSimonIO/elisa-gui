"use client"

import * as React from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface DraggableCardProps {
  id: string
  children: React.ReactNode
}

function DraggableCard({ id, children }: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none cursor-grab active:cursor-grabbing"
    >
      {children}
    </div>
  )
}

// Structure of Grid Items
export interface GridItem {
  id: string
  component: React.ReactNode
}

//  Draggable Grid Props -> Is extended by an Array of chosen Grid Items
interface DraggableGridProps {
  items: GridItem[]
  onReorder?: (items: GridItem[]) => void
  className?: string
}

export function DraggableGrid({ items: initialItems, onReorder, className }: DraggableGridProps) {

  // State Hooks to manage the Order of the Container Items / Components
  const [items, setItems] = React.useState<GridItem[]>(initialItems)
  const [activeId, setActiveId] = React.useState<string | null>(null)

  // Update items when initialItems changes (keeping the order)
  React.useEffect(() => {
    setItems((currentItems) => {
      // Create a map of current positions
      const orderMap = new Map(currentItems.map((item, index) => [item.id, index]))
      
      // Update items while preserving the order
      return initialItems
        .slice()
        .sort((a, b) => {
          const aOrder = orderMap.get(a.id) ?? initialItems.findIndex(item => item.id === a.id)
          const bOrder = orderMap.get(b.id) ?? initialItems.findIndex(item => item.id === b.id)
          return aOrder - bOrder
        })
    })
  }, [initialItems])


// useSensor Hook from dnd-kit to set up pointer and keyboard sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),

    // Keyboard Sensor for accessibility -> allows keyboard users to drag and drop items
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )


  // Handlers for Drag Start and Drag End events
  function handleDragStart(event: any) {
    setActiveId(event.active.id)
  }

  
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    setActiveId(null)

    if (over && active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex((item) => item.id === active.id)
        const newIndex = currentItems.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(currentItems, oldIndex, newIndex)
        
        onReorder?.(newItems)
        return newItems
      })
    }
  }

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
        <div className={className}>
          {items.map((item) => (
            <DraggableCard key={item.id} id={item.id}>
              {item.component}
            </DraggableCard>
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeItem ? (
          <div className="opacity-80 rotate-3 scale-105 transition-transform">
            {activeItem.component}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
