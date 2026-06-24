import SwiftUI

// Matches prototype #rxPage — prescription detail with EN/ES bilingual toggle
struct RxView: View {
    let userId: String
    @State private var prescription: Prescription? = nil
    @State private var isLoading: Bool = true
    @State private var language: Language = .en
    @State private var showRefillSheet: Bool = false

    enum Language { case en, es }

    var body: some View {
        ScrollView(showsIndicators: false) {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity).padding(.top, OngoSpacing.xxl)
            } else if let rx = prescription {
                prescriptionContent(rx)
            } else {
                emptyState
            }
        }
        .background(Color.ongoBackground)
        .navigationTitle("My Prescription")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                langToggle
            }
        }
        .task {
            await loadPrescription()
        }
        .sheet(isPresented: $showRefillSheet) {
            refillSheet
        }
    }

    // MARK: - Language toggle

    private var langToggle: some View {
        HStack(spacing: 0) {
            langButton("EN", value: .en)
            langButton("ES", value: .es)
        }
        .background(Color.ongoCardAlt)
        .clipShape(Capsule())
    }

    private func langButton(_ label: String, value: Language) -> some View {
        Button { withAnimation { language = value } } label: {
            Text(label)
                .font(OngoFont.label(12))
                .foregroundStyle(language == value ? .white : Color.ongoPrimary)
                .padding(.horizontal, OngoSpacing.sm)
                .padding(.vertical, 6)
                .background(language == value ? Color.ongoPrimary : Color.clear)
                .clipShape(Capsule())
        }
    }

    // MARK: - Prescription content

    private func prescriptionContent(_ rx: Prescription) -> some View {
        VStack(spacing: OngoSpacing.md) {
            // Ongo Rx letterhead
            OngoCard(cornerRadius: OngoRadius.md) {
                VStack(spacing: OngoSpacing.sm) {
                    // Brand header
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Ongo™Rx")
                                .font(.system(size: 20, weight: .black))
                                .foregroundStyle(Color.ongoPrimary)
                            Text(language == .en ? "Official Prescription Document" : "Documento de Prescripción Oficial")
                                .font(OngoFont.caption(10))
                                .foregroundStyle(Color.ongoTextTertiary)
                        }
                        Spacer()
                        Image(systemName: "cross.case.fill")
                            .font(.system(size: 28))
                            .foregroundStyle(Color.ongoPrimary.opacity(0.2))
                    }

                    Divider()

                    // Doctor info
                    HStack(alignment: .top, spacing: OngoSpacing.md) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(language == .en ? "Prescriber" : "Prescriptor")
                                .font(OngoFont.caption(10)).foregroundStyle(Color.ongoTextTertiary)
                            Text(language == .en ? "Ongo Affiliated Physician" : "Médico Afiliado a Ongo")
                                .font(OngoFont.subheadline(13))
                            Text("MD, Board Certified")
                                .font(OngoFont.caption(11)).foregroundStyle(Color.ongoTextSecondary)
                        }
                        Spacer()
                        if let pharmacy = rx.pharmacyName {
                            VStack(alignment: .trailing, spacing: 2) {
                                Text(language == .en ? "Pharmacy" : "Farmacia")
                                    .font(OngoFont.caption(10)).foregroundStyle(Color.ongoTextTertiary)
                                Text(pharmacy)
                                    .font(OngoFont.subheadline(13))
                                Text(rx.pharmacyPhone ?? "")
                                    .font(OngoFont.caption(11)).foregroundStyle(Color.ongoTextSecondary)
                            }
                        }
                    }

                    Divider()

                    // Patient info
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(language == .en ? "Date Issued" : "Fecha de Emisión")
                                .font(OngoFont.caption(10)).foregroundStyle(Color.ongoTextTertiary)
                            Text(rx.writtenAt.mediumDate)
                                .font(OngoFont.subheadline(13))
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(language == .en ? "Valid Until" : "Válido Hasta")
                                .font(OngoFont.caption(10)).foregroundStyle(Color.ongoTextTertiary)
                            Text(rx.expiresAt.mediumDate)
                                .font(OngoFont.subheadline(13))
                                .foregroundStyle(rx.isActive ? Color.ongoSuccess : Color.ongoError)
                        }
                    }
                }
            }

            // Medication card
            OngoCard {
                VStack(alignment: .leading, spacing: OngoSpacing.sm) {
                    Text(language == .en ? "MEDICATION" : "MEDICAMENTO")
                        .font(OngoFont.label(10)).foregroundStyle(Color.ongoTextTertiary)

                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(rx.medicationName)
                                .font(OngoFont.headline(20))
                            Text(rx.genericName)
                                .font(OngoFont.caption()).foregroundStyle(Color.ongoTextSecondary)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 4) {
                            Text(rx.dose)
                                .font(OngoFont.headline(18)).foregroundStyle(Color.ongoPrimary)
                            Text(rx.frequency)
                                .font(OngoFont.caption()).foregroundStyle(Color.ongoTextSecondary)
                        }
                    }

                    Divider()

                    HStack {
                        infoCell(label: language == .en ? "Quantity" : "Cantidad", value: "\(rx.quantity)")
                        Divider().frame(height: 32)
                        infoCell(label: language == .en ? "Days supply" : "Días de suministro", value: "\(rx.daysSupply)")
                        Divider().frame(height: 32)
                        infoCell(label: language == .en ? "Refills left" : "Recargas restantes", value: "\(rx.refillsRemaining)")
                    }

                    Divider()

                    VStack(alignment: .leading, spacing: 4) {
                        Text(language == .en ? "Instructions" : "Instrucciones")
                            .font(OngoFont.caption(10)).foregroundStyle(Color.ongoTextTertiary)
                        Text(language == .es && rx.instructionsEs != nil ? rx.instructionsEs! : rx.instructions)
                            .font(OngoFont.body())
                            .foregroundStyle(Color.ongoTextPrimary)
                    }
                }
            }

            // Status banner
            statusBanner(rx)

            // Refill CTA
            if rx.isActive {
                OngoPrimaryButton(title: language == .en ? "Request Refill" : "Solicitar Recarga") {
                    showRefillSheet = true
                }
                .padding(.horizontal, OngoSpacing.md)
            }

            // Document download (if available)
            if rx.documentURL != nil {
                OngoCard {
                    HStack(spacing: OngoSpacing.sm) {
                        Image(systemName: "doc.fill")
                            .font(.system(size: 24))
                            .foregroundStyle(Color.ongoError)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("prescription_\(String((rx.id ?? "").suffix(6))).pdf")
                                .font(OngoFont.subheadline(13))
                            Text("PDF · 142 KB")
                                .font(OngoFont.caption(11)).foregroundStyle(Color.ongoTextTertiary)
                        }
                        Spacer()
                        Button {
                            // WIRE: Open documentURL in Safari or share sheet
                        } label: {
                            Image(systemName: "arrow.down.circle.fill")
                                .font(.system(size: 24))
                                .foregroundStyle(Color.ongoPrimary)
                        }
                    }
                }
            }
        }
        .padding(.horizontal, OngoSpacing.md)
        .padding(.vertical, OngoSpacing.md)
        .padding(.bottom, 100)
    }

    private func statusBanner(_ rx: Prescription) -> some View {
        HStack(spacing: OngoSpacing.sm) {
            Image(systemName: rx.isActive ? "checkmark.seal.fill" : "clock.badge.exclamationmark.fill")
                .foregroundStyle(rx.isActive ? Color.ongoSuccess : Color.ongoTextTertiary)
            Text(rx.isActive
                 ? (language == .en ? "Active prescription" : "Receta activa")
                 : (language == .en ? "Prescription \(rx.status.rawValue)" : "Receta \(rx.status.rawValue)"))
                .font(OngoFont.subheadline())
                .foregroundStyle(rx.isActive ? Color.ongoSuccess : Color.ongoTextSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(OngoSpacing.sm)
        .background((rx.isActive ? Color.ongoSuccess : Color.ongoTextTertiary).opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: OngoRadius.sm))
        .padding(.horizontal, OngoSpacing.md)
    }

    private func infoCell(label: String, value: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(OngoFont.subheadline(14))
            Text(label).font(OngoFont.caption(10)).foregroundStyle(Color.ongoTextTertiary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: OngoSpacing.md) {
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 48))
                .foregroundStyle(Color.ongoTextTertiary)
            Text("No prescription yet")
                .font(OngoFont.subheadline())
                .foregroundStyle(Color.ongoTextSecondary)
            Text("Your prescription will appear here after your first approved doctor visit.")
                .font(OngoFont.caption())
                .foregroundStyle(Color.ongoTextTertiary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(OngoSpacing.xxxl)
    }

    // MARK: - Refill sheet

    private var refillSheet: some View {
        NavigationStack {
            VStack(spacing: OngoSpacing.lg) {
                Image(systemName: "pills.fill")
                    .font(.system(size: 48))
                    .foregroundStyle(Color.ongoPrimary)
                Text("Request a Refill")
                    .font(OngoFont.headline(22))
                Text("Your refill request will be reviewed by your assigned Ongo physician within 24 hours.")
                    .font(OngoFont.body())
                    .foregroundStyle(Color.ongoTextSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, OngoSpacing.xl)
                OngoPrimaryButton(title: "Submit Refill Request") {
                    Task { await submitRefill() }
                }
                .padding(.horizontal, OngoSpacing.lg)
                Spacer()
            }
            .padding(.top, OngoSpacing.xl)
            .navigationTitle("Refill Request")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") { showRefillSheet = false }
                }
            }
        }
        .presentationDetents([.medium])
    }

    // MARK: - Firestore

    private func loadPrescription() async {
        isLoading = true
        let prescriptions = try? await FirestoreService.shared.query(
            Prescription.self,
            collection: Prescription.collectionPath,
            filters: [("patientId", .isEqualTo, userId)],
            orderBy: ("writtenAt", descending: true),
            limit: 1
        )
        prescription = prescriptions?.first
        isLoading = false
    }

    private func submitRefill() async {
        guard let rxId = prescription?.id else { return }
        let request = RefillRequest(
            patientId: userId,
            prescriptionId: rxId,
            status: .pending,
            requestedAt: Date()
        )
        _ = try? await FirestoreService.shared.add(request, collection: RefillRequest.collectionPath)
        showRefillSheet = false
    }
}
