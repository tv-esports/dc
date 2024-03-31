export const convertNameToEmoji = (name: string) => {
    switch (name) {
        case "Silver":
            return "<:silver:924718416936452177>";
        case "Krypton":
            return "<:krypton:1224003661349523486>"
        case "Gold":
            return "<:gold:924717358344450058>"
        case "Carbon":
            return "<:carbon:924717886113734687>"
        case "Diamond":
            return "<:diamond:924717127259291648>"
        case "Rubin":
            return "<:rubin:1224003663450869800>"
        case "Sapphire":
            return "<:sapphire:924717252719312916>"
        default:
            return name;
    }
}