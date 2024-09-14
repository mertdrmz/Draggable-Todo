import React, { useState, ChangeEvent } from "react";

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggableLocation,
} from "react-beautiful-dnd";
import styled from "styled-components";
import { createRoot } from "react-dom/client";
import { nanoid } from "nanoid";
import { Modal, Button, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

interface Quote {
  id: string;
  content: string;
}

/* const grid = 10; */

const reorder = (
  list: Quote[],
  startIndex: number,
  endIndex: number
): Quote[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const move = (
  sourceList: Quote[],
  destinationList: Quote[],
  source: DraggableLocation,
  destination: DraggableLocation
) => {
  const sourceClone = Array.from(sourceList);
  const destClone = Array.from(destinationList);
  const [movedItem] = sourceClone.splice(source.index, 1);
  destClone.splice(destination.index, 0, movedItem);
  return [sourceClone, destClone];
};

const QuoteItem = styled.div`
  width: 100%;
  max-width: 800px;
  background-color: lightgreen;
  padding-left: 10px;
  cursor: pointer;
  display: flex;
  flex-direction: row; 
  justify-content: space-between; 
  align-items: center; 
  box-sizing: border-box;
  margin: 10px auto;
`;


const ButtonContainer = styled.div`
  display: flex;
  gap: 10px; 
  margin-top: 10px;
  align-self: stretch;
  padding-left: 25px
`;

interface QuoteProps {
  quote: Quote;
  index: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const Quote: React.FC<QuoteProps> = ({ quote, index, onEdit, onDelete }) => {
  return (
    <Draggable draggableId={quote.id} index={index}>
      {(provided) => (
        <QuoteItem
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {quote.content}
          <ButtonContainer>
            <Button
              variant="warning"
              size="sm"
              onClick={() => onEdit(quote.id)}
            >
              Düzenle
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(quote.id)}
            >
              Sil
            </Button>
          </ButtonContainer>
        </QuoteItem>
      )}
    </Draggable>
  );
};

const getListStyle = (isDraggingOver: boolean): React.CSSProperties => ({
  background: isDraggingOver ? "lightblue" : "lightgrey",
  
});

const QuoteApp: React.FC = () => {
  const [state, setState] = useState<Quote[][]>([]);
  const [newQuote, setNewQuote] = useState<string>(""); 
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
 
  const [editQuoteContent, setEditQuoteContent] = useState<string>("");
  

  const handleAddQuote = () => {
    if (newQuote.trim() === "") return;

    const newQuoteObj: Quote = {
      id: nanoid(),
      content: newQuote,
    };

    setState((prevState) => {
      const newState = [...prevState];
      if (!newState[0]) {
        newState[0] = [];
      }

      newState[0] = [...newState[0], newQuoteObj];

      return newState;
    });

    setNewQuote("");
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewQuote(e.target.value);
  };

  const handleEditQuote = (id: string) => {
    const allQuotes = state.flat();
    const quoteToEdit = allQuotes.find((quote) => quote.id === id);
    if (quoteToEdit) {
      setCurrentQuote(quoteToEdit);
      setEditQuoteContent(quoteToEdit.content);
      setEditDialogOpen(true);
    }
  };

  const handleSaveEdit = () => {
    if (currentQuote) {
      setState((prevState) => {
        const newState = prevState.map((group) =>
          group.map((quote) =>
            quote.id === currentQuote.id
              ? { ...quote, content: editQuoteContent }
              : quote
          )
        );
        console.log("Updated state after editing quote:", newState);
        return newState;
      });
      setEditDialogOpen(false);
    }
  };

  const handleDeleteQuote = (id: string) => {
    setState((prevState) => {
      const newState = prevState.map((group) =>
        group.filter((quote) => quote.id !== id)
      );
      const filteredState = newState.filter((group) => group.length > 0);
      console.log("Updated state after deleting quote:", filteredState);
      return filteredState;
    });
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    if (
      source.index === destination.index &&
      source.droppableId === destination.droppableId
    ) {
      return;
    }

    const sInd = +source.droppableId;
    const dInd = +destination.droppableId;

    if (sInd === dInd) {
      const items = reorder(state[sInd], source.index, destination.index);
      const newState = [...state];
      newState[sInd] = items;
      console.log("Updated state after reorder:", newState);
      setState(newState);
    } else {
      const [sourceClone, destClone] = move(
        state[sInd],
        state[dInd],
        source,
        destination
      );
      const newState = [...state];
      newState[sInd] = sourceClone;
      newState[dInd] = destClone;
      console.log("Updated state after move:", newState);
      setState(newState.filter((group) => group.length > 0));
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "inline-block", textAlign: "left" }}>
          <input
            type="text"
            value={newQuote}
            onChange={handleInputChange}
            placeholder="Listeye Ekle"
          />
          <button   type="button" onClick={handleAddQuote}>
            Ekle
          </button>
        </div>
      </div>
      <div
        style={{ display: "flex", overflowX: "auto", justifyContent: "center" }}
      >
        <DragDropContext onDragEnd={onDragEnd}>
          {state.map((el, ind) => (
            <Droppable key={ind} droppableId={`${ind}`}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  style={getListStyle(snapshot.isDraggingOver)}
                  {...provided.droppableProps}
                >
                  {el.map((item, index) => (
                    <Quote
                      key={item.id}
                      quote={item}
                      index={index}
                      onEdit={handleEditQuote}
                      onDelete={handleDeleteQuote}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      </div>
      <Modal show={editDialogOpen} onHide={() => setEditDialogOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Güncelle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Yapılacak</Form.Label>
            <Form.Control
              type="text"
              value={editQuoteContent}
              onChange={(e) => setEditQuoteContent(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditDialogOpen(false)}>
            Kapat
          </Button>
          <Button variant="primary" onClick={handleSaveEdit}>
            Kaydet
          </Button>
          
        </Modal.Footer>
      </Modal>
    </div>
  );
};

const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<QuoteApp />);
} else {
  console.error("Root container element not found");
}

export default QuoteApp;