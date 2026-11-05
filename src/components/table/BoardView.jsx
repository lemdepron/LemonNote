import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { rowLabel } from "@/lib/table";
import { cn } from "@/lib/utils";

export default function BoardView({ columns, rows, onCell }) {
  const select = columns.find((column) => column.type === "select");
  if (!select) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-card/20 px-6 py-14 text-center">
        <p className="text-[14px]">Board view needs a select field.</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Add a field of type “Select” to group rows into columns.
        </p>
      </div>
    );
  }

  const extras = rows
    .map((row) => row.cells?.[select.id])
    .filter((value) => value && !(select.options || []).includes(value));
  const lanes = [...new Set([...(select.options || []), ...extras])].filter(Boolean);

  const cardsIn = (value) => rows.filter((row) => (row.cells?.[select.id] || "") === value);

  const drop = (result) => {
    if (!result.destination) return;
    const value = result.destination.droppableId === "__none" ? "" : result.destination.droppableId;
    onCell(result.draggableId, select.id, value);
  };

  const renderCard = (row, index) => (
    <Draggable key={row.id} draggableId={row.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "rounded-lg border border-border/70 bg-card px-2.5 py-2 shadow-sm transition",
            snapshot.isDragging && "border-primary/50 bg-card shadow-lg"
          )}
        >
          <p className="text-[12.5px] leading-snug text-foreground/90">{rowLabel({ columns }, row)}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {columns
              .filter((column) => column.id !== select.id && column.type !== "text")
              .map((column) => {
                const value = row.cells?.[column.id];
                if (value === undefined || value === null || value === "" || value === false) return null;
                return (
                  <span
                    key={column.id}
                    className="max-w-full truncate rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[9.5px] text-muted-foreground"
                  >
                    {column.type === "checkbox" ? column.name : String(value)}
                  </span>
                );
              })}
          </div>
        </div>
      )}
    </Draggable>
  );

  const renderLane = (value, label) => (
    <div key={value || "__none"} className="w-[220px] shrink-0">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
        <span className="font-mono text-[10px] text-muted-foreground/70">{cardsIn(value).length}</span>
      </div>
      <Droppable droppableId={value || "__none"}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "min-h-[80px] space-y-2 rounded-xl border border-border/50 bg-background/40 p-2 transition",
              snapshot.isDraggingOver && "border-primary/30 bg-primary/5"
            )}
          >
            {cardsIn(value).map((row, index) => renderCard(row, index))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );

  return (
    <DragDropContext onDragEnd={drop}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {lanes.map((option) => renderLane(option, option))}
        {renderLane("", "ungrouped")}
      </div>
    </DragDropContext>
  );
}