const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const { v4: uuidv4 } = require('uuid'); // Importa o módulo UUID para gerar IDs únicos

const app = express();
app.use(cors());
app.use(express.json());

const uri =
  process.env.URI;

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Definindo o esquema e modelo de dados
const messageSchema = new mongoose.Schema({
  sender: String,
  message: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const conversationSchema = new mongoose.Schema({
  conversation_id: { type: String, unique: true },
  messages: [messageSchema],
});

const Conversation = mongoose.model("Conversation", conversationSchema);

app.post("/startConversation", async (req, res) => {
  try {
    const conversation_id = uuidv4(); // Gera um novo ID único para a nova conversa
    const conversation = new Conversation({ conversation_id, messages: [] });
    await conversation.save();
    res.status(200).json({ conversation_id });
  } catch (error) {
    res.status(500).json({ message: "Error starting new conversation" });
  }
});

app.post("/saveConversation", async (req, res) => {
  const { conversation_id, messages } = req.body;

  try {
    // Encontra ou cria uma nova conversa com o ID fornecido
    let conversation = await Conversation.findOne({ conversation_id });

    if (!conversation) {
      conversation = new Conversation({ conversation_id, messages });
    } else {
      // Adiciona as novas mensagens ao histórico existente
      conversation.messages = [...conversation.messages, ...messages];
    }

    await conversation.save();
    res.status(200).send("Conversa salva com sucesso.");
  } catch (error) {
    res.status(500).send("Erro ao salvar a conversa: " + error.message);
  }
});

app.get("/", (req, res) => {
  res.send("Server is up and running");
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
