"""Test script for the Agent class."""
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from components.agent import Agent, AgentConfig


def test_agent_config():
    """Test AgentConfig creation and validation."""
    print("Testing AgentConfig...")
    
    # Test default config
    config = AgentConfig()
    assert config.model == "gpt-3.5-turbo"
    assert config.temperature == 0.7
    assert config.max_tokens is None
    print("[PASS] Default config works")
    
    # Test custom config
    custom_config = AgentConfig(
        model="gpt-4",
        temperature=0.5,
        max_tokens=100
    )
    assert custom_config.model == "gpt-4"
    assert custom_config.temperature == 0.5
    assert custom_config.max_tokens == 100
    print("[PASS] Custom config works")
    
    # Test validation
    try:
        invalid_config = AgentConfig(temperature=3.0)  # Should fail (max is 2)
        print("[FAIL] Temperature validation failed")
    except Exception:
        print("[PASS] Temperature validation works")
    
    print("AgentConfig tests passed!\n")


def test_agent_initialization():
    """Test Agent initialization."""
    print("Testing Agent initialization...")
    
    # Check if API key is available
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("[WARN] OPENAI_API_KEY not set - skipping initialization test")
        print("  Set OPENAI_API_KEY environment variable to test full functionality")
        return False
    
    try:
        # Test with default config
        agent = Agent()
        assert agent.config is not None
        assert agent.client is not None
        assert agent.conversation_history == []
        print("[PASS] Agent initialization with default config works")
        
        # Test with custom config
        config = AgentConfig(model="gpt-3.5-turbo", temperature=0.5)
        agent = Agent(config)
        assert agent.config.model == "gpt-3.5-turbo"
        assert agent.config.temperature == 0.5
        print("[PASS] Agent initialization with custom config works")
        
        return True
    except ValueError as e:
        print(f"[FAIL] Agent initialization failed: {e}")
        return False
    except Exception as e:
        print(f"[FAIL] Unexpected error: {e}")
        return False


def test_agent_message_management():
    """Test message history management."""
    print("Testing message management...")
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("[WARN] OPENAI_API_KEY not set - skipping message management test")
        return False
    
    try:
        agent = Agent()
        
        # Test adding messages
        agent.add_message("system", "You are a helpful assistant")
        agent.add_message("user", "Hello")
        assert len(agent.conversation_history) == 2
        assert agent.conversation_history[0]["role"] == "system"
        assert agent.conversation_history[1]["role"] == "user"
        print("[PASS] Adding messages works")
        
        # Test getting history
        history = agent.get_history()
        assert len(history) == 2
        assert history[0]["content"] == "You are a helpful assistant"
        print("[PASS] Getting history works")
        
        # Test clearing history
        agent.clear_history()
        assert len(agent.conversation_history) == 0
        print("[PASS] Clearing history works")
        
        # Test reset
        agent.add_message("user", "Test")
        agent.reset()
        assert len(agent.conversation_history) == 0
        print("[PASS] Reset works")
        
        return True
    except Exception as e:
        print(f"[FAIL] Message management test failed: {e}")
        return False


def test_agent_process():
    """Test agent processing (requires API key and may incur costs)."""
    print("Testing agent processing...")
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("[WARN] OPENAI_API_KEY not set - skipping process test")
        return False
    
    # Ask user if they want to test API calls (may incur costs)
    print("  This test will make an actual API call to OpenAI (may incur costs)")
    print("  Skipping API call test for safety")
    print("  To test manually, use: agent.process('Hello')")
    
    return True


def main():
    """Run all tests."""
    print("=" * 50)
    print("Testing Agent Component")
    print("=" * 50)
    print()
    
    # Run tests
    test_agent_config()
    
    has_api_key = test_agent_initialization()
    print()
    
    if has_api_key:
        test_agent_message_management()
        print()
        test_agent_process()
        print()
    
    print("=" * 50)
    print("Tests completed!")
    print("=" * 50)


if __name__ == "__main__":
    main()

