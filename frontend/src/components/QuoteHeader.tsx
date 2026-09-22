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
}: QuoteHeaderProps) => {
  return (
    <header className="quote-masthead">
      <div className="quote-masthead__top">
        <div className="quote-company-details">
          <p>Plot 54368, CBD, I-Towers</p>
          <p>3rd Floor, Unit 3A · Gaborone</p>
          <p>P. O. Box 404268</p>
          <p className="quote-company-contact">Tel 392 0000 · Fax 392 0001</p>
        </div>

        <div className="quote-brand-block">
          <div className="quote-logo-wrap">
            <img
              src="/exclusive2.png"
              alt="Exclusive Life Insurance"
              className="quote-logo"
            />
          </div>
        </div>

        <div className="quote-header-summary">
          <p className="quote-header-product">{productType || "Insurance quotation"}</p>
          <dl className="quote-metadata">
            <div>
              <dt>Quote No.</dt>
              <dd>{quoteId}</dd>
            </div>
            {date && (
              <div>
                <dt>Date</dt>
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
      </div>

      <div className="quote-title-row">
        <p className="quote-eyebrow">Quotation</p>
        <h1 className="quote-document-title">
          Quotation for {clientName || "Client Name"}
        </h1>
      </div>
    </header>
  );
};
