interface QuoteHeaderProps {
  quoteId: string;
  clientName: string;
  productType: string;
  date?: string;
  clientEmail?: string;
  clientContact?: string;
  clientId?: string;
}

export const QuoteHeader = ({
  quoteId,
  clientName,
  productType,
  date,
  clientEmail,
  clientContact,
  clientId
}: QuoteHeaderProps) => {
  return (
    <header className="quote-masthead">
      <div className="quote-masthead__top">
        <div className="quote-brand-block">
          <div className="quote-logo-wrap">
            <img
              src="/exclusive.png"
              alt="Exclusive Life Insurance"
              className="quote-logo"
              onError={(e) => {
                e.currentTarget.src = "/exclusive2.png";
              }}
            />
          </div>
          <p className="quote-brand-kicker">Exclusive Life Insurance</p>
        </div>

        <div className="quote-company-details">
          <p>Plot 54368, CBD, I-Towers</p>
          <p>3rd Floor, Unit 3A · Gaborone</p>
          <p>P. O. Box 404268</p>
          <p className="quote-company-contact">Tel 392 0000 · Fax 392 0001</p>
        </div>
      </div>

      <div className="quote-title-row">
        <div>
          <p className="quote-eyebrow">{productType || "Insurance quotation"}</p>
          <h1 className="quote-document-title">
            Quotation for {clientName || "Client Name"}
          </h1>
        </div>
        <dl className="quote-metadata">
          <div>
            <dt>Quotation</dt>
            <dd>#{quoteId}</dd>
          </div>
          {date && (
            <div>
              <dt>Date issued</dt>
              <dd>
                {new Date(date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </header>
  );
};
