import os
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class AgentConfig(BaseModel):
    """Configuration for the agent."""
    model: str = Field(default="gpt-3.5-turbo", description="OpenAI model to use")
    temperature: float = Field(default=0.7, ge=0, le=2, description="Sampling temperature")
    max_tokens: Optional[int] = Field(default=None, description="Maximum tokens to generate")
    api_key: Optional[str] = Field(default=None, description="OpenAI API key")


class Agent:
    """Basic agent template for AI/ML tasks."""
    
    def __init__(self, config: Optional[AgentConfig] = None):
        """
        Initialize the agent.
        
        Args:
            config: Agent configuration. If None, uses default config.
        """
        self.config = config or AgentConfig()
        
        # Set up OpenAI client
        api_key = self.config.api_key or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY environment variable or pass it in config.")
        
        self.client = openai.OpenAI(api_key=api_key)
        self.conversation_history: List[Dict[str, str]] = []
    
    def add_message(self, role: str, content: str) -> None:
        """
        Add a message to the conversation history.
        
        Args:
            role: Message role ('system', 'user', or 'assistant')
            content: Message content
        """
        self.conversation_history.append({"role": role, "content": content})
    
    def clear_history(self) -> None:
        """Clear the conversation history."""
        self.conversation_history = []
    
    def process(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Process a prompt and return the agent's response.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt to set behavior
            
        Returns:
            Agent's response text
        """
        # Add system prompt if provided and not already in history
        if system_prompt and not any(msg.get("role") == "system" for msg in self.conversation_history):
            self.add_message("system", system_prompt)
        
        # Add user prompt
        self.add_message("user", prompt)
        
        # Get response from OpenAI
        response = self.client.chat.completions.create(
            model=self.config.model,
            messages=self.conversation_history,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens
        )
        
        # Extract response text
        assistant_message = response.choices[0].message.content
        self.add_message("assistant", assistant_message)
        
        return assistant_message
    
    def get_history(self) -> List[Dict[str, str]]:
        """
        Get the conversation history.
        
        Returns:
            List of message dictionaries
        """
        return self.conversation_history.copy()
    
    def reset(self) -> None:
        """Reset the agent (clear history and reinitialize)."""
        self.clear_history()

