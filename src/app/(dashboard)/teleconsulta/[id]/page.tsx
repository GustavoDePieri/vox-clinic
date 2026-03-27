import { getTeleconsultaInfo, createTeleconsultaRoom } from "@/server/actions/teleconsulta"
import { TeleconsultaRoom } from "./teleconsulta-room"

export default async function TeleconsultaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let room = await getTeleconsultaInfo(id)

  // Create room if it doesn't exist yet
  if (!room.videoRoomUrl) {
    const created = await createTeleconsultaRoom(id)
    room = {
      ...room,
      videoRoomUrl: created.roomUrl,
      videoToken: created.videoToken,
      ownerToken: created.ownerToken,
    }
  }

  return <TeleconsultaRoom appointment={room} />
}
