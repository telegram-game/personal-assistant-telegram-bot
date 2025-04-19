import tiktoken
import torch
from torch.utils.data import Dataset
from torch.utils.data import DataLoader
from torch import le, nn
from lib.layers.transformer_block import TransformerBlock
from lib.layers.layer_norm import LayerNorm
from lib.model import IModel

class GPTDataset(Dataset):
    def __init__(self, txt, tokenizer, max_length, stride):
        self.input_ids = []
        self.target_ids = []

        # Tokenize the entire text
        token_ids = tokenizer.encode(txt, allowed_special={"<|endoftext|>"})
        if (len(token_ids) <= max_length):
            token_ids += [tokenizer.eos_token_id] * (max_length - len(token_ids))
            self.input_ids.append(torch.tensor(token_ids))
            self.target_ids.append(torch.tensor(token_ids))

        # Use a sliding window to chunk the book into overlapping sequences of max_length
        for i in range(0, len(token_ids) - max_length, stride):
            input_chunk = token_ids[i:i + max_length]
            target_chunk = token_ids[i + 1: i + max_length + 1]
            self.input_ids.append(torch.tensor(input_chunk))
            self.target_ids.append(torch.tensor(target_chunk))

    def __len__(self):
        return len(self.input_ids)

    def __getitem__(self, idx):
        return self.input_ids[idx], self.target_ids[idx]

class GPT2Model(IModel):
    def __init__(self, cfg):
        super(GPT2Model, self).__init__()
        self.tokenizer = tiktoken.get_encoding("gpt2")
        self.tokenizer.eos_token_id = 50256 # GPT2's EOS token ID

        self.config = cfg

        self.tok_emb = nn.Embedding(cfg["vocab_size"], cfg["emb_dim"])
        self.pos_emb = nn.Embedding(cfg["context_length"], cfg["emb_dim"])
        self.drop_emb = nn.Dropout(cfg["drop_rate"])

        self.trf_blocks = nn.Sequential(
            *[TransformerBlock(cfg) for _ in range(cfg["n_layers"])])

        self.final_norm = LayerNorm(cfg["emb_dim"])
        self.out_head = nn.Linear(
            cfg["emb_dim"], cfg["vocab_size"], bias=False
        )

    def forward(self, in_idx):
        batch_size, seq_len = in_idx.shape
        tok_embeds = self.tok_emb(in_idx)
        pos_embeds = self.pos_emb(torch.arange(seq_len, device=in_idx.device))
        x = tok_embeds + pos_embeds  # Shape [batch_size, num_tokens, emb_size]
        x = self.drop_emb(x)
        x = self.trf_blocks(x)
        x = self.final_norm(x)
        logits = self.out_head(x)
        return logits

    def set_device(self, device):
        self.to(device)
        self.device = device

    def encode(self, text):
        encoded = self.tokenizer.encode(text, allowed_special={'<|endoftext|>'})
        encoded_tensor = torch.tensor(encoded).unsqueeze(0) # add batch dimension
        return encoded_tensor

    def decode(self, token_ids):
        flat = token_ids.squeeze(0) # remove batch dimension
        return self.tokenizer.decode(flat.tolist())
    
    def validate_train_data(self, data) -> str | None:
        token_ids = self.tokenizer.encode(data, allowed_special={'|endoftext|>'})
        if len(token_ids) < self.config["context_length"]:
            return "Training data is too short. Minimum length is {}".format(self.config["context_length"])
        
        return None
    
    def predict(self, data, max_new_tokens=10):
        idx = self.encode(data).to(self.device)  # (batch, n_tokens)
        context_size = self.config["context_length"]

        for _ in range(max_new_tokens):

            # Crop current context if it exceeds the supported context size
            # E.g., if LLM supports only 5 tokens, and the context size is 10
            # then only the last 5 tokens are used as context
            idx_cond = idx[:, -context_size:]

            # Get the predictions
            with torch.no_grad():
                logits = self(idx_cond)

            # Focus only on the last time step
            # (batch, n_tokens, vocab_size) becomes (batch, vocab_size)
            logits = logits[:, -1, :]

            # Apply softmax to get probabilities
            probas = torch.softmax(logits, dim=-1)  # (batch, vocab_size)

            # Get the idx of the vocab entry with the highest probability value
            idx_next = torch.argmax(probas, dim=-1, keepdim=True)  # (batch, 1)

            # Append sampled index to the running sequence
            idx = torch.cat((idx, idx_next), dim=1)  # (batch, n_tokens+1)

        return self.decode(idx)

    def start_train(self, data, num_epochs):
        train_loader = self.create_data_loader(data)
        print("Training...", flush=True)

        with torch.no_grad(): # Disable gradient tracking for efficiency because we are not training, yet
            train_loss = self.calc_loss_loader(train_loader, self, self.device)
            print("Train loss: ", train_loss, flush=True)
        
        optimizer = torch.optim.AdamW(self.parameters(), lr=0.0004, weight_decay=0.1)
        self.train_model(train_loader, optimizer, self.device, num_epochs)

        print ("Training completed.", flush=True)
        self.can_load = False

    def start_eval(self, data):
        pass


    def create_data_loader(self, data):
        # Get config
        max_length = self.config["context_length"]
        stride = self.config["stride"]
        batch_size = 2
        shuffle = True
        drop_last = False
        num_workers = 0

        # Create dataset
        dataset = GPTDataset(data, self.tokenizer, max_length, stride)

        # Create dataloader
        dataloader = DataLoader(
            dataset, batch_size=batch_size, shuffle=shuffle, drop_last=drop_last, num_workers=num_workers)

        return dataloader

    def calc_loss_loader(self, data_loader, model, device, num_batches=None):
        total_loss = 0.
        if len(data_loader) == 0:
            return float("nan")
        elif num_batches is None:
            num_batches = len(data_loader)
        else:
            # Reduce the number of batches to match the total number of batches in the data loader
            # if num_batches exceeds the number of batches in the data loader
            num_batches = min(num_batches, len(data_loader))
        for i, (input_batch, target_batch) in enumerate(data_loader):
            if i < num_batches:
                loss = self.calc_loss_batch(input_batch, target_batch, model, device)
                total_loss += loss.item()
            else:
                break
        return total_loss / num_batches

    def calc_loss_batch(self, input_batch, target_batch, model, device):
        input_batch, target_batch = input_batch.to(device), target_batch.to(device)
        logits = model(input_batch)
        loss = torch.nn.functional.cross_entropy(logits.flatten(0, 1), target_batch.flatten())
        return loss

    def train_model(self, train_loader, optimizer, device, num_epochs):
        # Initialize lists to track losses and tokens seen
        tokens_seen, global_step = 0, -1

        # Main training loop
        for epoch in range(num_epochs):
            self.train()  # Set model to training mode

            for input_batch, target_batch in train_loader:
                optimizer.zero_grad() # Reset loss gradients from previous batch iteration
                loss = self.calc_loss_batch(input_batch, target_batch, self, device)
                loss.backward() # Calculate loss gradients
                optimizer.step() # Update model weights using loss gradients
                tokens_seen += input_batch.numel()
                global_step += 1

            # Print a sample text after each epoch
            print (f"Epoch {epoch+1}/{num_epochs} completed.", flush=True)
        