import Image from "next/image";

const items = [
    { src: "/image-hero/1.png", tint: "bg-rose" },
    { src: "/image-hero/2.png", tint: "bg-peach" },
    { src: "/image-hero/3.png", tint: "bg-lavender" },
    { src: "/image-hero/4.png", tint: "bg-sage" },
    { src: "/image-hero/5.png", tint: "bg-vanilla" },
];

const loop = [...items, ...items];

export function ImageMarquee() {
    return (
        <div
            className="marquee relative overflow-hidden py-6 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
            role="region"
            aria-label="Aperçu de nos gâteaux"
        >
            <div className="marquee-track">
                {[false, true].flatMap((duplicate) =>
                    loop.map((item, i) => {
                        const hidden = duplicate || i >= items.length;
                        return (
                            <div
                                key={`${duplicate ? "b" : "a"}-${i}`}
                                aria-hidden={hidden}
                                className="mr-4 shrink-0"
                            >
                                <div
                                    className={`relative h-72 w-56 overflow-hidden rounded-3xl sm:h-80 sm:w-64 ${item.tint}`}
                                >
                                    <Image
                                        src={item.src}
                                        alt={hidden ? "" : "Photo d'un de nos gâteaux"}
                                        fill
                                        sizes="256px"
                                        loading={!duplicate && i < 4 ? "eager" : "lazy"}
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}