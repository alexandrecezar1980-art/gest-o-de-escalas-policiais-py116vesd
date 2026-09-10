migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('servidores')

    if (!col.fields.getByName('matricula')) {
      col.fields.add(
        new TextField({
          name: 'matricula',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('cpf')) {
      col.fields.add(
        new TextField({
          name: 'cpf',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('email')) {
      col.fields.add(
        new EmailField({
          name: 'email',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('dia_compensacao')) {
      col.fields.add(
        new SelectField({
          name: 'dia_compensacao',
          required: false,
          values: [
            'Segunda-feira',
            'Terça-feira',
            'Quarta-feira',
            'Quinta-feira',
            'Sexta-feira',
            'Sábado',
            'Domingo',
            'Rotativo',
          ],
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('servidores')
    const fieldsToRemove = ['matricula', 'cpf', 'email', 'dia_compensacao']
    for (const name of fieldsToRemove) {
      const f = col.fields.getByName(name)
      if (f) {
        col.fields.removeById(f.id)
      }
    }
    app.save(col)
  },
)
