import Foundation

// Static editorial tip content — matches prototype TIPS_CONTENT JS object
struct TipContent {
    let id: String
    let eyebrow: String
    let headline: String
    let sub: String
    let sections: [Section]

    struct Section {
        let title: String
        let body: String?
        let bullets: [String]

        init(title: String, body: String? = nil, bullets: [String] = []) {
            self.title = title
            self.body = body
            self.bullets = bullets
        }
    }

    static let all: [String: TipContent] = [
        "tip-protein": TipContent(
            id: "tip-protein", eyebrow: "Nutrition", headline: "Front-load your protein",
            sub: "GLP-1 medications reduce hunger — make every bite count.",
            sections: [
                Section(title: "Why protein matters on GLP-1",
                        body: "When you're eating less, you risk losing muscle along with fat. Prioritizing protein preserves lean mass and keeps you full longer."),
                Section(title: "How to do it",
                        bullets: ["Aim for 25–30g of protein at breakfast", "Choose eggs, Greek yogurt, cottage cheese, or protein shakes", "Keep a protein source at every meal"]),
                Section(title: "Your goal", body: "0.7–1g of protein per pound of goal body weight per day.")
            ]),
        "tip-sleep": TipContent(
            id: "tip-sleep", eyebrow: "Recovery", headline: "Sleep is a weight loss tool",
            sub: "Poor sleep raises hunger hormones and makes GLP-1 less effective.",
            sections: [
                Section(title: "The science", body: "Sleep deprivation increases ghrelin (hunger) and decreases leptin (fullness). Even one bad night can trigger cravings the next day."),
                Section(title: "Sleep hygiene wins", bullets: ["Set a consistent bedtime — even on weekends", "Keep your room cool and dark", "No screens 30 minutes before bed", "Avoid alcohol and large meals late at night"])
            ]),
        "tip-walk": TipContent(
            id: "tip-walk", eyebrow: "Movement", headline: "The 10-minute walk",
            sub: "Walking after meals blunts blood sugar spikes and boosts GLP-1 effectiveness.",
            sections: [
                Section(title: "Why it works", body: "A brief walk after eating accelerates glucose uptake, reduces post-meal insulin demand, and compounds into significant calorie burn over time."),
                Section(title: "Make it stick", bullets: ["Walk 10 min after lunch or dinner", "Use it as a phone break or podcast time", "Track it as a daily habit in Ongo"])
            ]),
        "tip-hydration": TipContent(
            id: "tip-hydration", eyebrow: "Nutrition", headline: "Hydration kills phantom hunger",
            sub: "Thirst is frequently misread as hunger — especially on GLP-1.",
            sections: [
                Section(title: "The overlap", body: "The brain processes thirst and hunger through overlapping signals. Drinking water first can eliminate false hunger cues in minutes."),
                Section(title: "Daily targets", bullets: ["Aim for 2.5–3L of water per day", "Front-load in the morning before food", "Add electrolytes if you feel fatigued or headachy"])
            ]),
        "tip-fiber": TipContent(
            id: "tip-fiber", eyebrow: "Nutrition", headline: "Fiber > calorie counting",
            sub: "High-fiber foods slow digestion, extend fullness, and feed your gut microbiome.",
            sections: [
                Section(title: "What fiber does", body: "Soluble fiber slows gastric emptying, blunting blood sugar swings. Insoluble fiber feeds beneficial gut bacteria linked to metabolic health."),
                Section(title: "Easy fiber sources", bullets: ["Oats, beans, lentils (soluble)", "Vegetables, flaxseed (insoluble)", "Aim for 25–35g per day"])
            ]),
        "tip-strength": TipContent(
            id: "tip-strength", eyebrow: "Movement", headline: "Lift weights twice a week",
            sub: "Resistance training preserves muscle while on GLP-1 and keeps metabolism high.",
            sections: [
                Section(title: "Why it matters", body: "GLP-1 medications cause rapid weight loss. Without resistance exercise, a significant portion comes from muscle. Lifting prevents this."),
                Section(title: "Getting started", bullets: ["Bodyweight squats, push-ups, and rows count", "Aim for 2 full-body sessions per week", "Rest 48h between sessions"])
            ]),
        "tip-mindful": TipContent(
            id: "tip-mindful", eyebrow: "Habits", headline: "Slow down at meals",
            sub: "GLP-1 medications slow gastric emptying — eating fast leads to discomfort.",
            sections: [
                Section(title: "The 20-minute rule", body: "It takes about 20 minutes for fullness signals to reach your brain. Eating slowly gives your body time to register satiety before you overeat."),
                Section(title: "Practical tips", bullets: ["Put your fork down between bites", "Aim for 20+ minutes per meal", "No screens while eating — distractions double intake"])
            ]),
        "tip-non-scale": TipContent(
            id: "tip-non-scale", eyebrow: "Mindset", headline: "The scale isn't the only win",
            sub: "Non-scale victories matter — and predict long-term success.",
            sections: [
                Section(title: "What to track", bullets: ["Looser clothes or a new belt notch", "Better sleep and more energy", "Lower resting heart rate", "Reduced joint pain or improved mood", "Fewer cravings for ultra-processed foods"])
            ]),
        "tip-meal-prep": TipContent(
            id: "tip-meal-prep", eyebrow: "Nutrition", headline: "Prep three meals tonight",
            sub: "Willpower is lowest when you're hungry. Prep removes the decision.",
            sections: [
                Section(title: "The 1-hour prep", body: "Cook a large protein batch, portion vegetables, and pre-pack two or three meals. This eliminates the worst GLP-1 mistake: skipping meals and losing muscle."),
                Section(title: "Prep priorities", bullets: ["1 protein (chicken, eggs, tofu)", "1 grain (rice, oats, quinoa)", "3 vegetables or a large salad"])
            ]),
        "tip-weigh-best-time": TipContent(
            id: "tip-weigh-best-time", eyebrow: "Tracking", headline: "Weigh after the bathroom, before food",
            sub: "Same conditions every time = data you can trust.",
            sections: [
                Section(title: "Why it matters", body: "Body weight naturally fluctuates 1–3 lbs daily due to water, food volume, and hormones. Consistent timing removes noise and reveals your true trend."),
                Section(title: "The protocol", bullets: ["Morning only", "After using the bathroom", "Before eating or drinking", "Same scale, same surface"])
            ]),
        "tip-side-effects": TipContent(
            id: "tip-side-effects", eyebrow: "Medication", headline: "Nausea easing trick",
            sub: "Most GLP-1 nausea peaks in weeks 2–4 and resolves on its own.",
            sections: [
                Section(title: "Why it happens", body: "GLP-1 medications slow gastric emptying. Eating large or fatty meals can overwhelm this and cause nausea."),
                Section(title: "What helps", bullets: ["Eat small, frequent meals", "Avoid high-fat, fried, or very sweet foods", "Stay hydrated — nausea gets worse when dehydrated", "Inject on a full stomach (not fasted)", "Message your doctor if severe"])
            ]),
        "default-keep-going": TipContent(
            id: "default-keep-going", eyebrow: "Motivation", headline: "Small steps. Real change.",
            sub: "Sustainable weight loss is built one habit at a time.",
            sections: [
                Section(title: "Your progress is real", body: "Even on days when the scale doesn't move, your body is adapting. Trust the process and keep logging.")
            ]),
    ]
}
