import os
import torch
from datasets import load_dataset, load_from_disk

def download_and_load_data():
    if not os.path.exists("data/ucirvine/sms_spam"):
        data = load_dataset("ucirvine/sms_spam")
        data.save_to_disk("data/ucirvine/sms_spam")
    
    loaded_data = load_from_disk("data/ucirvine/sms_spam")
    return loaded_data

def save_model(model, path):
    if not os.path.exists("output"):
        os.makedirs("output")
    torch.save(model.state_dict(), f"./output/{path}")

def load_example_data():
   with open("./data/example.txt", "r", encoding="utf-8") as file:
    text_data = file.read()
    return text_data