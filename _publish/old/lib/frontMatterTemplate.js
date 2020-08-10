async function FrontMatterTemplate() {
    this.jwio_id = -1;
    this.layout = 'post';
    this.title = 'TITLE';
    this.subheading = 'SUBHEADING';
    this.date = generateDateString();
    this.lastModified = this.date;
    this.published = false;
    this.description = 'DESCRIPTION';
    this.tags = ['my-tag'];
    this.coverImage = 'COVER IMAGE';
    this.devto_id = -1;
}

function generateDateString() {
    let now = new Date();
    const offset = now.getTimezoneOffset()
    now = new Date(now.getTime() + (offset*60*1000))
    return now.toISOString().split('T')[0]
}

module.exports = {
    FrontMatterTemplate
}
