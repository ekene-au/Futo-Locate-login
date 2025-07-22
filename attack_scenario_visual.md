# AttackScenario Interface Visualization

```

    📋 ATTACKSCENARIO INTERFACE STRUCTURE
    ═══════════════════════════════════════════════════════════════
    
    🏷️  IDENTIFICATION & METADATA
    ┌─────────────────────────────────────────────────────────┐
    │ 🆔 id: string           │ Unique scenario identifier    │
    │ 🏷️  tags: string[]      │ Categorization metadata       │
    └─────────────────────────────────────────────────────────┘
    
    📊 CLASSIFICATION & DIFFICULTY  
    ┌─────────────────────────────────────────────────────────┐
    │ ⚔️  type: AttackType     │ Attack methodology type      │
    │ 📈 difficulty: Level     │ Learning progression level   │
    └─────────────────────────────────────────────────────────┘
    
    📝 CONTENT & NARRATIVE
    ┌─────────────────────────────────────────────────────────┐
    │ 📄 title: string        │ Descriptive scenario title   │
    │ 📝 description: string  │ Brief context summary        │
    │ 📖 scenario: string     │ Detailed narrative content   │
    └─────────────────────────────────────────────────────────┘
    
    🎯 ASSESSMENT & LEARNING
    ┌─────────────────────────────────────────────────────────┐
    │ ☑️  options: Option[]    │ Array of response choices    │
    │ ✅ correctAnswer: string │ Correct response identifier  │
    │ 💡 explanation: string  │ Educational explanation      │
    │ 🚨 indicators: string[] │ Threat indicators to notice  │
    └─────────────────────────────────────────────────────────┘
    
    🔗 RELATED TYPE DEPENDENCIES
    ═══════════════════════════════════════════════════════════════
    
         AttackType ◄────────┐
         (Enum/Union)        │
                             │
    DifficultyLevel ◄────────┼──── AttackScenario
    (Enum/Union)             │    (Main Interface)
                             │
    ScenarioOption[] ◄───────┘
    (Interface Array)
    
    🎓 PURPOSE: Educational Training System for Cybersecurity
    
    
    📊 DATA FLOW & USAGE PATTERN
    ═══════════════════════════════════════════════════════════════
    
    1️⃣  SCENARIO CREATION
         ┌─────────────────┐
         │ Define Metadata │ ➤ id, type, difficulty, tags
         └─────────────────┘
                   ⬇️
    2️⃣  CONTENT DEVELOPMENT  
         ┌─────────────────┐
         │ Create Narrative│ ➤ title, description, scenario
         └─────────────────┘
                   ⬇️
    3️⃣  ASSESSMENT DESIGN
         ┌─────────────────┐
         │ Build Questions │ ➤ options, correctAnswer
         └─────────────────┘
                   ⬇️
    4️⃣  EDUCATIONAL VALUE
         ┌─────────────────┐
         │ Add Learning    │ ➤ explanation, indicators
         └─────────────────┘
    
    💼 EXAMPLE IMPLEMENTATION:
    ═══════════════════════════════════════════════════════════════
    
    const phishingScenario: AttackScenario = {
      🆔 id: "phishing-email-001",
      ⚔️  type: AttackType.PHISHING,
      📄 title: "Suspicious Executive Email",
      📝 description: "CEO impersonation attempt",
      📈 difficulty: DifficultyLevel.INTERMEDIATE,
      📖 scenario: "You receive an urgent email from the CEO...",
      ☑️  options: [
        { id: "A", text: "Reply immediately" },
        { id: "B", text: "Verify through other channels" },
        { id: "C", text: "Forward to IT security" }
      ],
      ✅ correctAnswer: "B",
      💡 explanation: "Always verify urgent requests...",
      🚨 indicators: [
        "Urgent language",
        "Unusual sender behavior", 
        "Request for sensitive info"
      ],
      🏷️  tags: ["email", "social-engineering", "CEO-fraud"]
    };
    
```

## Summary

The `AttackScenario` interface represents a comprehensive data structure for cybersecurity training scenarios. It combines:

- **Identification**: Unique tracking and categorization
- **Classification**: Attack type and difficulty assessment  
- **Content**: Rich narrative and contextual information
- **Assessment**: Interactive learning with multiple choice options
- **Education**: Explanations and threat indicators for learning

This interface enables the creation of structured, educational cybersecurity training content that can be systematically organized, delivered, and assessed.
