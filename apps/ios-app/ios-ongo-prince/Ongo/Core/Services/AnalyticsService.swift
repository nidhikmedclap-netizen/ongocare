import Foundation
import FirebaseAnalytics

// MARK: - Thin wrapper around Firebase Analytics with typed event names
enum AnalyticsService {
    // MARK: - Auth
    static func logSignUp(method: String = "email") {
        Analytics.logEvent(AnalyticsEventSignUp, parameters: ["method": method])
    }

    static func logLogin(method: String = "email") {
        Analytics.logEvent(AnalyticsEventLogin, parameters: ["method": method])
    }

    // MARK: - Onboarding
    static func logQuizCompleted(bmi: Double) {
        Analytics.logEvent("quiz_completed", parameters: ["bmi": bmi])
    }

    static func logSurveyQuestionAnswered(questionId: String, section: String) {
        Analytics.logEvent("survey_question_answered", parameters: [
            "question_id": questionId,
            "section": section
        ])
    }

    static func logSurveyCompleted() {
        Analytics.logEvent("survey_completed", parameters: nil)
    }

    static func logEligibilityResult(status: String) {
        Analytics.logEvent("eligibility_result", parameters: ["status": status])
    }

    // MARK: - Engagement
    static func logCheckinLogged(type: String) {
        Analytics.logEvent("checkin_logged", parameters: ["type": type])
    }

    static func logWeightLogged() {
        Analytics.logEvent("weight_logged", parameters: nil)
    }

    static func logBookingStarted() {
        Analytics.logEvent("booking_started", parameters: nil)
    }

    static func logBookingCompleted(visitType: String) {
        Analytics.logEvent("booking_completed", parameters: ["visit_type": visitType])
    }

    // MARK: - Commerce
    static func logCheckoutStarted(planTier: String) {
        Analytics.logEvent(AnalyticsEventBeginCheckout, parameters: ["plan_tier": planTier])
    }

    static func logPurchaseCompleted(planTier: String, value: Double) {
        Analytics.logEvent(AnalyticsEventPurchase, parameters: [
            "plan_tier": planTier,
            AnalyticsParameterValue: value,
            AnalyticsParameterCurrency: "USD"
        ])
    }

    // MARK: - ATF beta waitlist
    static func logAIBetaWaitlistJoined(feature: String) {
        Analytics.logEvent("ai_beta_waitlist_joined", parameters: ["feature": feature])
    }
}
