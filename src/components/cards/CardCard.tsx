'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Card } from '@/types/database'
import { useTheme } from '@/components/theme/ThemeContext'

interface CardCardProps {
	readonly card: Card
}

export function CardCard({ card }: CardCardProps) {
	const { config } = useTheme()
	const messageLabel =
		card.message_count === 1 ? '1 mensagem' : `${card.message_count} mensagens`
	const initial = card.name.charAt(0).toUpperCase()

	return (
		<Link
			href={`/card/${card.slug}`}
			className="group flex items-center justify-between gap-3.5 rounded-xl border border-white/20 bg-neutral-400/20 p-3 shadow-lg shadow-black/15 backdrop-blur-lg transition-all duration-200 hover:border-white/35 hover:bg-neutral-300/25"
		>
			{/* Avatar & User Info */}
			<div className="flex items-center gap-3 min-w-0">
				{/* Avatar Container */}
				<div className="shrink-0">
					<div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
						{card.image_url ? (
							<Image
								src={card.image_url}
								alt={card.image_alt ?? card.name}
								width={44}
								height={44}
								unoptimized
								loading="lazy"
								decoding="async"
								className="h-full w-full object-cover transition-opacity duration-300"
							/>
						) : (
							<span className="text-sm font-semibold" style={{ color: config.primaryHex }}>
								{initial}
							</span>
						)}
					</div>
				</div>

				{/* Text Info */}
				<div className="flex flex-col min-w-0 justify-center">
					<h2 className="truncate text-sm sm:text-base font-semibold text-white transition-colors">
						{card.name}
					</h2>
					<span className="text-sm font-bold text-white/80">
						{card.message_count} <span className="text-xs font-normal text-[#aaaaaa]">{card.message_count === 1 ? 'msg' : 'msgs'}</span>
					</span>
				</div>
			</div>
		</Link>
	)
}
