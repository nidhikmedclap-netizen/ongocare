import SwiftUI

// Matches prototype #devicesPage — connected health devices
struct DevicesView: View {
    @State private var connectedDevices: [DeviceEntry] = []
    @State private var showHealthKitAlert: Bool = false

    struct DeviceEntry: Identifiable {
        let id: String
        let name: String
        let type: DeviceType
        var isConnected: Bool
        let description: String

        enum DeviceType: String {
            case fitness, scale, bp, glucose
            var icon: String {
                switch self {
                case .fitness: return "figure.walk.circle.fill"
                case .scale:   return "scalemass.fill"
                case .bp:      return "heart.fill"
                case .glucose: return "drop.fill"
                }
            }
            var color: Color {
                switch self {
                case .fitness: return Color.ongoPrimary
                case .scale:   return Color(hex: "#5a8fd9")
                case .bp:      return Color.ongoError
                case .glucose: return Color.ongoOrange
                }
            }
        }
    }

    private let availableDevices: [DeviceEntry] = [
        DeviceEntry(id: "apple-health", name: "Apple Health", type: .fitness, isConnected: false, description: "Sync steps, activity, and workouts"),
        DeviceEntry(id: "fitbit", name: "Fitbit", type: .fitness, isConnected: false, description: "Steps, heart rate, and sleep"),
        DeviceEntry(id: "withings", name: "Withings Scale", type: .scale, isConnected: false, description: "Weight and BMI via smart scale"),
        DeviceEntry(id: "omron", name: "Omron BP Monitor", type: .bp, isConnected: false, description: "Blood pressure readings"),
        DeviceEntry(id: "dexcom", name: "Dexcom CGM", type: .glucose, isConnected: false, description: "Continuous glucose monitoring"),
    ]

    var connected: [DeviceEntry] { connectedDevices.filter { $0.isConnected } }
    var available: [DeviceEntry] { connectedDevices.filter { !$0.isConnected } }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: OngoSpacing.md) {
                // Connected section
                if !connected.isEmpty {
                    deviceSection(title: "Connected", devices: connected)
                }

                // Available section
                deviceSection(title: "Available to Connect", devices: available)

                OngoCard {
                    HStack(alignment: .top, spacing: OngoSpacing.sm) {
                        Image(systemName: "info.circle").font(.system(size: 14)).foregroundStyle(Color.ongoPrimary)
                        Text("Device data is used to enrich your Ongo health score and daily check-ins. We never share it with third parties.")
                            .font(OngoFont.caption()).foregroundStyle(Color.ongoTextSecondary)
                    }
                }
            }
            .padding(.horizontal, OngoSpacing.md)
            .padding(.vertical, OngoSpacing.md)
            .padding(.bottom, 100)
        }
        .background(Color.ongoBackground)
        .navigationTitle("Connected Devices")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { connectedDevices = availableDevices }
    }

    private func deviceSection(title: String, devices: [DeviceEntry]) -> some View {
        VStack(alignment: .leading, spacing: OngoSpacing.xs) {
            Text(title).font(OngoFont.subheadline(14))
                .padding(.horizontal, OngoSpacing.xxs)
            OngoCard {
                VStack(spacing: 0) {
                    ForEach(devices.indices, id: \.self) { i in
                        let device = devices[i]
                        deviceRow(device)
                        if i < devices.count - 1 { Divider() }
                    }
                }
            }
        }
    }

    private func deviceRow(_ device: DeviceEntry) -> some View {
        HStack(spacing: OngoSpacing.sm) {
            ZStack {
                Circle()
                    .fill(device.type.color.opacity(0.12))
                    .frame(width: 40, height: 40)
                Image(systemName: device.type.icon)
                    .font(.system(size: 18))
                    .foregroundStyle(device.type.color)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(device.name).font(OngoFont.subheadline(14))
                Text(device.isConnected ? "✓ Synced" : device.description)
                    .font(OngoFont.caption(11))
                    .foregroundStyle(device.isConnected ? Color.ongoSuccess : Color.ongoTextSecondary)
            }
            Spacer()
            Button {
                toggleDevice(id: device.id)
            } label: {
                Text(device.isConnected ? "Disconnect" : "Connect")
                    .font(OngoFont.label(12))
                    .foregroundStyle(device.isConnected ? Color.ongoError : Color.ongoPrimary)
                    .padding(.horizontal, OngoSpacing.sm)
                    .padding(.vertical, 6)
                    .background(
                        (device.isConnected ? Color.ongoError : Color.ongoPrimary).opacity(0.1)
                    )
                    .clipShape(Capsule())
            }
        }
        .padding(.vertical, OngoSpacing.xs)
    }

    private func toggleDevice(id: String) {
        guard let idx = connectedDevices.firstIndex(where: { $0.id == id }) else { return }
        if id == "apple-health" && !connectedDevices[idx].isConnected {
            showHealthKitAlert = true
            return
        }
        withAnimation {
            connectedDevices[idx].isConnected.toggle()
        }
    }
}
