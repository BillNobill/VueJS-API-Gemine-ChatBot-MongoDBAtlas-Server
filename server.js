import express, { json } from "express";
import mongoose, { Schema, model } from "mongoose"; // Importando Schema e model
import "dotenv/config"; // A importação do dotenv foi unificada
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.URI;

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Definindo o esquema e modelo de dados
const messageSchema = new Schema({
  sender: String,
  message: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Ajustando o esquema da conversa para usar o IP como chave principal
const conversationSchema = new Schema({
  user_ip: { type: String, unique: true }, // Alterado para usar o IP como chave
  city: String,
  region: String,
  country: String,
  messages: [messageSchema],
});

const Conversation = model("Conversation", conversationSchema);

// Rota para iniciar uma nova conversa
app.post("/startConversation", async (req, res) => {
  const { user_ip, city, region, country } = req.body;

  try {
    // Verifica se já existe uma conversa com o mesmo IP
    const existingConversation = await Conversation.findOne({ user_ip });

    if (existingConversation != null) {
      // Se já existir, retorna uma mensagem sem criar um novo usuário
      return res
        .status(200)
        .json({ message: "Conversa já existe para este IP." });
    }
    // Caso não exista, cria uma nova conversa
    const conversation = new Conversation({
      user_ip,
      city,
      region,
      country,
      messages: [],
    });
    await conversation.save();
    res.status(200).json({ message: "Iniciou! Conversa criada com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error starting new conversation" });
  }
});

// Rota para salvar a conversa
app.post("/saveConversation", async (req, res) => {
  const { user_ip, messages } = req.body;

  // Verifica se o user_ip é válido
  if (!user_ip) {
    return res.status(400).json({ error: "User IP is required" });
  }

  try {
    // Verifica se a conversa já existe com base no user_ip
    let conversation = await Conversation.findOne({ user_ip });

    if (!conversation) {
      // Se não existir, cria uma nova conversa
      conversation = new Conversation({ user_ip, messages });
    } else {
      // Se existir, adiciona as novas mensagens
      conversation.messages = [...conversation.messages, ...messages];
    }

    // Salva a conversa (nova ou atualizada)
    await conversation.save();
    res.status(200).json("Conversa salva com sucesso.");
  } catch (error) {
    res.status(500).send("Erro ao salvar a conversa: " + error.message);
  }
});

// Rota para obter o histórico da conversa com base no user_ip
app.get("/getConversation", async (req, res) => {
  const user_ip = req.query.user_ip;

  // Verifica se o user_ip foi passado
  if (!user_ip) {
    return res.status(400).json({ error: "User IP is required" });
  }

  try {
    // Busca a conversa no banco de dados
    const conversation = await Conversation.findOne({ user_ip });

    // Verifica se a conversa foi encontrada
    if (!conversation) {
      return res
        .status(404)
        .json({ error: "No conversation found for this IP" });
    }

    // Retorna o histórico de mensagens
    res.status(200).json(conversation.messages);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching conversation: " + error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Server is up and running");
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
